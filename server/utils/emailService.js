import dotenv from 'dotenv';
dotenv.config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'no-reply@garudaurbanlines.com';

export const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!BREVO_API_KEY) {
      console.error('Email sending failed: BREVO_API_KEY is not defined in .env');
      return false;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: 'Garuda Urbanlines', email: BREVO_SENDER_EMAIL },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Email sending failed:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error in sendEmail:', error);
    return false;
  }
};

export const sendOTP = async (to, otp) => {
  const html = `
    <div style="font-family: sans-serif; text-align: center; padding: 20px;">
      <h2>Garuda Urbanlines</h2>
      <p>Your OTP for verification is:</p>
      <h1 style="color: #6a11cb; letter-spacing: 5px;">${otp}</h1>
      <p>Please do not share this OTP with anyone.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'Your Verification OTP', html });
};

export const sendTicket = async (to, bookingDetails) => {
  const boardingCity = bookingDetails.assignment?.route?.name?.split(' - ')[0]?.toUpperCase() || 'BOARDING';
  const droppingCity = bookingDetails.assignment?.route?.name?.split(' - ')[1]?.toUpperCase() || 'DROPPING';

  const seatsHtml = bookingDetails.seats.map(seat => `
    <tr style="border-bottom: 1px dashed #d2b48c;">
      <td style="padding: 12px 8px; font-weight: bold;">${seat.seatNumber}</td>
      <td style="padding: 12px 8px;">${seat.passengerName}</td>
      <td style="padding: 12px 8px;">${seat.age}</td>
      <td style="padding: 12px 8px;">${seat.gender}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        .ticket-container {
          background-color: #fffcf2; 
          max-width: 700px; 
          margin: 0 auto; 
          padding: 30px; 
          border: 2px dashed #8b7355; 
          border-radius: 12px; 
          box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
          font-family: 'Courier New', Courier, monospace; 
          color: #3e352a; 
          box-sizing: border-box;
        }
        .header { text-align: center; border-bottom: 2px solid #8b7355; padding-bottom: 16px; margin-bottom: 24px; }
        .grid-item { width: 50%; display: inline-block; vertical-align: top; box-sizing: border-box; }
        .right-align { text-align: right; }
        .journey-box { background-color: #f5deb3; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center; }
        .route-col { width: 45%; display: inline-block; vertical-align: middle; box-sizing: border-box; }
        .route-arrow { width: 8%; display: inline-block; text-align: center; vertical-align: middle; font-size: 24px; }
        .responsive-table { width: 100%; min-width: 500px; border-collapse: collapse; text-align: left;}
      
        
        @media only screen and (max-width: 600px) {
          .ticket-container { padding: 15px; }
          .grid-item { width: 100%; display: block; text-align: left !important; margin-bottom: 16px; }
          .route-col { width: 100%; display: block; text-align: center !important; margin-bottom: 8px; }
          .route-arrow { width: 100%; display: block; margin: 8px 0; transform: rotate(90deg); display: inline-block; }
          .fare-total { text-align: left !important; margin-top: 16px; }
          .responsive-table th { padding: 6px 4px; font-size: 11px; }
          .responsive-table td { padding: 10px 4px !important; font-size: 12px; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
      <div class="ticket-container">
        <div class="header">
          <h2 style="margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Garuda Urbanlines</h2>
          <p style="margin: 8px 0 0 0; font-style: italic; font-size: 14px;">Journey Details</p>
        </div>

        <div style="margin-bottom: 24px; font-size: 0;">
          <div class="grid-item" style="font-size: 16px;">
            <p style="margin: 0 0 8px 0;"><strong>PNR NO:</strong> ${bookingDetails.pnr}</p>
            <p style="margin: 0 0 8px 0;"><strong>STATUS:</strong> <span style="color: green; font-weight: bold;">CONFIRMED</span></p>
          </div>
          <div class="grid-item right-align" style="font-size: 16px;">
            <p style="margin: 0 0 8px 0;"><strong>DATE:</strong> ${bookingDetails.assignment?.journeyDate || new Date().toLocaleDateString()}</p>
            <p style="margin: 0 0 8px 0;"><strong>BUS:</strong> ${bookingDetails.assignment?.bus ? `${bookingDetails.assignment.bus.name} (${bookingDetails.assignment.bus.busNumber})` : `Garuda ${bookingDetails.assignment?.busType || 'Premium'} (TBA)`}</p>
          </div>
        </div>

        <div class="journey-box" style="font-size: 0;">
          <div class="route-col" style="text-align: left; font-size: 16px;">
            <p style="margin: 0 0 4px 0; font-size: 16px; color: #666;">${boardingCity}</p>
            <p style="margin: 0; font-weight: bold; font-size: 16px;">${bookingDetails.boardingPoint}</p>
          </div>
          <div class="route-arrow" style="font-size: 24px;">&rarr;</div>
          <div class="route-col" style="text-align: right; font-size: 16px;">
            <p style="margin: 0 0 4px 0; font-size: 16px; color: #666;">${droppingCity}</p>
            <p style="margin: 0; font-weight: bold; font-size: 16px;">${bookingDetails.droppingPoint}</p>
          </div>
        </div>

        <div style="border-top: 2px dashed #8b7355; padding-top: 24px;">
          <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 16px;">PASSENGER DETAILS</p>
          <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
            <table class="responsive-table">
              <thead>
                <tr style="border-bottom: 1px solid #8b7355;">
                  <th style="width: 20%;">Seat</th>
                  <th style="width: 45%;">Name</th>
                  <th style="width: 15%;">Age</th>
                  <th style="width: 20%;">Gender</th>
                </tr>
              </thead>
              <tbody>
                ${seatsHtml}
              </tbody>
            </table>
          </div>
        </div>

        <div class="fare-total" style="margin-top: 24px; text-align: right; font-size: 20px; font-weight: bold;">
          TOTAL FARE: &#8377;${bookingDetails.totalAmount}
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to, subject: 'Your Bus Ticket - Garuda Urbanlines', html });
};
