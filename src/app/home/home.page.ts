import { Component } from '@angular/core';
import { Auth0AuthenticationImpl } from '../auth-service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private auth: Auth0AuthenticationImpl) {}

  startAuth0(): void {
    // this.auth.launchAuth0();
    this.auth.quickstartAuth0();
  }
}
