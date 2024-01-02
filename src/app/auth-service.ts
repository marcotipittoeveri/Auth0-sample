import { Injectable, Inject, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { HttpOptions, HttpHeaders } from '@capacitor/core';
import { App } from '@capacitor/app';
import { AuthService } from '@auth0/auth0-angular';
import { RedirectLoginOptions } from '@auth0/auth0-spa-js';
import { Observable, of, from, fromEvent } from 'rxjs';
import { mergeMap, map, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Auth0AuthenticationImpl {

  private appUrlOpened$?: Observable<string>;

  constructor(
    private ngZone: NgZone,
    private auth0: AuthService,
  ) {}

  /*
   * Makes the call that opens the capacitor browser & hides the splash screen. This is used for login
   * and signup.
   */
  launchAuth0(): Observable<void> {
    console.log('>>> launchauth0')
    return from(
      this.auth0
        .loginWithRedirect({
          authorizationParams: {
            screen_hint: 'signup',
          },
          openUrl(url: string) {
            return Browser.open({
              url,
              windowName: '_self',
            });
          },
        })
        .pipe(
          mergeMap(() => {
            console.log('>>> loginwithRedirect');
            return this.listenForAuth0Redirect();
          })
        )
    );
  }

  /**
   * Called to logout the user, which is called when the userLogout action is dispatched.
   * Relies on the same appUrlOpen listener the login uses to close the browser
   * @returns observable when logout completes
   */
  auth0Logout(): Observable<void> {
    return this.auth0
      .logout({
        logoutParams: {
          returnTo: environment.auth0.redirectUri,
        },
        openUrl(url: string) {
          return Browser.open({ url });
        },
      })
      .pipe(
        mergeMap(() => {
          return this.listenForAuth0Redirect();
        })
      );
  }

  /**
   * Adds an app listener that listens for a browser open event & inspects the url associated with
   * the event. If the url is valid, then it calls the function responsible for handling the redirect.
   */
  listenForAuth0Redirect(): Observable<void> {
    return from(this.getAppUrlOpenObservable()).pipe(
      take(1),
      mergeMap((url: string) =>
        this.getNgZoneObservable().pipe(
          mergeMap(() => {
            console.log('>>> return url', url);
            if (
              environment.auth0.redirectUri &&
              url?.startsWith(environment.auth0.redirectUri)
            ) {
              if (
                url.includes('state=') &&
                (url.includes('code=') || url.includes('error='))
              ) {
                console.log('>>> return Success', url);
                return this.auth0SignInComplete(url);
              } else {
                console.log('>>> else close 1', url);
                void Browser.close();
                return of(undefined);
              }
            } else {
              console.log('>>> else close 2', url);
              void Browser.close();
              return of(undefined);
            }
          })
        )
      )
    );
  }

  /**
   * Called to handle the auth0 login redirect. It either completes the observable or
   * completes the observable with an error, depending on the url sent back from auth0.
   */
  auth0SignInComplete(url: string): Observable<void> {
    return this.auth0.handleRedirectCallback(url).pipe(
      take(1),
      mergeMap(() => {
        console.log('>>> sign in complete close', url);
        if (url.includes('error=')) {
          throw Error(url);
        }
        void Browser.close();
        return of(undefined);
      })
    );
  }

  /**
   * Creates an observable that emits whenever the appUrlOpen event is fired
   * @returns an observable instead of an event so its easier to use with rxjs
   */
  getAppUrlOpenObservable(): Observable<string> {
    this.appUrlOpened$ = new Observable((observer) => {
      void App.addListener('appUrlOpen', ({ url }) => {
        console.log('>>>appUrlOpen', url)
        return observer.next(url)
      });
      return () => App.removeAllListeners();
    });
    return this.appUrlOpened$;
  }

  /**
   * Creates an Observable that emits when the code is ready to be run outside angular
   * @returns an observable instead of a callback so its easier to use with rxjs
   */
  getNgZoneObservable(): Observable<void> {
    return new Observable((observer) => {
      this.ngZone.run(() => {
        console.log('>>> ngzone');
        observer.next();
      });
    });
  }

  quickstartAuth0(): void {
    debugger;
    console.log('>>>', environment)
    this.quickStartListener();
    this.auth0
      .loginWithRedirect({
        async openUrl(url: string) {
          console.log('>>> url', url)
          await Browser.open({ url, windowName: '_self' });
        }
      })
    .subscribe();
  }

  quickStartListener(): void {
    App.addListener('appUrlOpen', ({ url }) => {
      console.log('>>>appUrlOpen', url)
      debugger;
      // Must run inside an NgZone for Angular to pick up the changes
      // https://capacitorjs.com/docs/guides/angular
      this.ngZone.run(() => {
        console.log('>>>appUrlOpen', url)
        if (url?.startsWith(environment.auth0.redirectUri)) {
          // If the URL is an authentication callback URL..
          if (
            url.includes('state=') &&
            (url.includes('error=') || url.includes('code='))
          ) {
            // Call handleRedirectCallback and close the browser
            this.auth0
              .handleRedirectCallback(url)
              .pipe(mergeMap(() => Browser.close()))
              .subscribe();
          } else {
            Browser.close();
          }
        }
      });
    });
  }

  login() {
    console.log('>>>login')
    this.auth0
      .loginWithRedirect({
        async openUrl(url: string) {
          await Browser.open({ url, windowName: '_self' });
        }
      })
      .subscribe();
  }
}
