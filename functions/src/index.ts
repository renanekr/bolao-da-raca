import * as functions from 'firebase-functions';
import { sendEmailNotification } from './functions/notification-email';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//

export const helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});


// export const sendEmailNotification = functions.https.onRequest((request, response) => {
//     response.send("Hello from Firebase!");
// });
   
