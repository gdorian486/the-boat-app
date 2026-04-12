import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import Keycloak from 'keycloak-js';
import { APP_PATHS } from '../../../../app.routes.constants';

@Component({
  selector: 'app-dashboard-page',
  imports: [MatButtonModule, MatCardModule, MatToolbarModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  private readonly keycloak = inject(Keycloak);
  private readonly document = inject(DOCUMENT);

  protected get username(): string {
    return this.keycloak.tokenParsed?.['preferred_username'] ?? '';
  }

  protected logout(): void {
    this.keycloak.logout({
      redirectUri: `${this.document.location.origin}/${APP_PATHS.LOGIN}`
    }).catch((err: unknown) => {
      console.error('Logout failed', err);
    });
  }
}
