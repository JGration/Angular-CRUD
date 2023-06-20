import { Component, OnInit } from '@angular/core';
import { UserService } from './user.service';
import { User } from './user';
import { catchError, tap } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  users: User[] = [];
  userForm!: FormGroup;
  editingUser: User | null = null; // Track the user being edited

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.initForm();
    this.getUsers();
  }

  private initForm(): void {
    this.userForm = new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email])
    });
  }

  getUsers(): void {
    this.userService.getUsers()
      .pipe(
        tap(response => this.users = response),
        catchError(error => {
          console.error(error);
          return EMPTY;
        })
      )
      .subscribe();
  }

  addUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    const { name, email } = this.userForm.value;
    const newUser: User = { id: 0, name, email };

    this.userForm.reset(); //clean the form

    this.userService.addUser(newUser)
      .pipe(
        tap(response => this.users.push(response)),
        catchError(error => {
          console.error(error);
          return EMPTY;
        })
      )
      .subscribe();
  }

  editUser(user: User): void {
    this.editingUser = user;
    this.userForm.patchValue({ name: user.name, email: user.email });
  }

  updateUser(): void {
    if (!this.editingUser) {
      return;
    }

    const updatedUser = {
      ...this.editingUser,
      name: this.userForm.value.name,
      email: this.userForm.value.email
    };

    this.userService.updateUser(updatedUser)
      .pipe(
        tap(response => {
          const index = this.users.findIndex(u => u.id === response.id);
          if (index !== -1) {
            this.users[index] = response;
          }
          this.cancelEdit();
        }),
        catchError(error => {
          console.error(error);
          return EMPTY;
        })
      )
      .subscribe();
  }

  deleteUser(id: number): void {
    this.userService.deleteUser(id)
      .pipe(
        tap(() => {
          const index = this.users.findIndex(u => u.id === id);
          if (index !== -1) {
            this.users.splice(index, 1);
          }
        }),
        catchError(error => {
          console.error(error);
          return EMPTY;
        })
      )
      .subscribe();
  }

  cancelEdit(): void {
    this.editingUser = null;
    this.userForm.reset();
  }
}
