// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  auth0: {
    audience: 'https://sso-poc-dev-refresh-token',
    clientId: '2MtNfRJlYuoy0yAk1z67LClwJXs2fBwy',
    domain: 'sso-poc2.us.auth0.com', // Custom domain
    redirectUri: 'com.everi.trilogymobile://sso-poc2.us.auth0.com/capacitor/com.everi.trilogymobile/callback',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
