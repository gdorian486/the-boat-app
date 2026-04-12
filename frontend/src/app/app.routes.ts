import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { APP_PATHS } from './app.routes.constants';

export const routes: Routes = [
  {
    path: APP_PATHS.LOGIN,
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login-page.component').then(
        (m) => m.LoginPageComponent
      )
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: APP_PATHS.BOATS
      },
      {
        path: APP_PATHS.BOATS,
        loadComponent: () =>
          import('./features/boats/pages/dashboard/dashboard-page.component').then(
            (m) => m.DashboardPageComponent
          )
      }
    ]
  },
  {
    path: APP_PATHS.NOT_FOUND,
    loadComponent: () =>
      import('./features/not-found/not-found-page.component').then(
        (m) => m.NotFoundPageComponent
      )
  }
];
