import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { APP_PATHS } from '../../app.routes.constants';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-not-found-page',
  imports: [MatButtonModule, RouterLink],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundPageComponent {
  protected readonly appPaths = APP_PATHS;
  protected readonly themeService = inject(ThemeService);
}
