const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

const firebaseConfig = {
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_SDK)),
    projectId: "eigene-webseite-a34ee",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

exports.handler = async function (event, context) {
    try {
        const snapshot = await db.collection('bookings').get();

        // Anfang des ICS-Kalenders
        let icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//Your Company//Your App//EN
`;

        snapshot.forEach((doc) => {
            const data = doc.data();

            // Zeitzone anpassen (z. B. auf UTC+1 für MEZ)
            const startDateTime = new Date(`${data.startDate}T${data.startTime}:00`);
            const endDateTime = new Date(`${data.startDate}T${data.endTime}:00`);

            // Zeiten in UTC umwandeln und dann in das benötigte Format bringen
            const utcStartDateTime = new Date(startDateTime.getTime() - 60 * 60 * 1000); // Eine Stunde zurück
            const utcEndDateTime = new Date(endDateTime.getTime() - 60 * 60 * 1000);

            const formatDate = (date) =>
                date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

            icsContent += `
BEGIN:VEVENT
SUMMARY:${data.name}
DESCRIPTION:${data.description || ''}
DTSTART:${formatDate(utcStartDateTime)}
DTEND:${formatDate(utcEndDateTime)}
LOCATION:${data.location || ''}
ORGANIZER:mailto:${data.email || 'no-reply@example.com'}
END:VEVENT
`;
        });

        // Kalender beenden
        icsContent += `
END:VCALENDAR`;

        // Response zurückgeben
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/calendar',
                'Content-Disposition': 'attachment; filename="calendar.ics"',
            },
            body: icsContent,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
