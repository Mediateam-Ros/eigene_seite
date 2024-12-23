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
        let icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//Your Company//Your App//EN
`;

        snapshot.forEach((doc) => {
            const data = doc.data();
            const startDate = data.startDate.replace(/-/g, '');
            const startTime = data.startTime.replace(/:/g, '');
            const endTime = data.endTime.replace(/:/g, '');

            icsContent += `
BEGIN:VEVENT
SUMMARY:${data.name}
DESCRIPTION:${data.description || ''}
DTSTART:${startDate}T${startTime}00Z
DTEND:${startDate}T${endTime}00Z
LOCATION:
END:VEVENT
`;
        });

        icsContent += `
END:VCALENDAR`;

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
