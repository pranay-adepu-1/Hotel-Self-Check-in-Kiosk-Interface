# Hotel Self Check-in Kiosk Interface

This is a working prototype for the internship project shown in the screenshots. It includes a guest pre-registration screen, booking lookup, check-in confirmation, front desk dashboard, verification workflow, guest status updates, audit history, and CSV reporting.

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js with Express
- Database: In-memory seeded data for prototype demo
- Reports: CSV export endpoint

## Run the Project

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

## Demo Records

Use any of these values in the booking lookup field:

- `SRN-1024`
- `arjun@example.com`
- `9123456780`

## Main Features

- Guest pre-registration form
- Booking lookup by booking ID, email, or phone
- Identity detail capture using ID type and last 4 digits
- Self check-in flow
- Front desk dashboard with search and status filter
- Status workflow: Pending Verification, Verified, Checked In, Issue
- Room assignment and staff notes
- Daily summary and CSV report download

## API Routes

- `GET /api/health`
- `GET /api/guests`
- `GET /api/guests/:id`
- `POST /api/register`
- `POST /api/lookup`
- `PATCH /api/guests/:id/status`
- `POST /api/guests/:id/checkin`
- `GET /api/report.csv`

## Suggested Next Improvements

- Replace in-memory data with MySQL, PostgreSQL, or Firebase
- Add login for front desk staff
- Add PDF invoice/report generation
- Add WhatsApp or email confirmation integration
- Add image upload for ID proof
