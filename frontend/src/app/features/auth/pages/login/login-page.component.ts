import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';
import { APP_PATHS } from '../../../../app.routes.constants';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly keycloak = inject(Keycloak);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly themeService = inject(ThemeService);
  protected readonly isLoading = signal(false);

  protected login(): void {
    this.isLoading.set(true);
    const redirectUri = `${globalThis.location.origin}${this.router.serializeUrl(
      this.router.createUrlTree([APP_PATHS.BOATS])
    )}`;
    void this.keycloak
      .login({ redirectUri })
      .catch(() => {
        this.snackBar.open(
          'Unable to connect to the authentication server. Please try again.',
          'Close',
          { duration: 5000 }
        );
      })
      .finally(() => this.isLoading.set(false));
  }
}
