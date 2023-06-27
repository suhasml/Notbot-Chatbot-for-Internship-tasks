"use strict";

// Access token for your app
// (copy token from DevX getting started page
// and save it as environment variable into the .env file)
const token = process.env.WHATSAPP_TOKEN;

// Imports dependencies and set up http server
const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json()); // creates express http server

// In-memory storage for session data
const sessions = {};

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

// Accepts POST requests at /webhook endpoint
app.post("/webhook", (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the Incoming webhook message
  console.log(JSON.stringify(req.body, null, 2));

  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from =
        req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload

      // Check if a session exists for the user
      let session = sessions[from];
      if (!session) {
        // No session found, create a new session
        session = {
          id: from,
          context: {}
        };
        sessions[from] = session;
      }

      if (req.body.entry[0].changes[0].value.messages[0].type === "text") {
        // Extract the message text from the webhook payload for text messages
        let msg_body =
          req.body.entry[0].changes[0].value.messages[0].text.body;
        handleMessage(session, phone_number_id, from, msg_body, null);
      } else if (
        req.body.entry[0].changes[0].value.messages[0].type === "interactive"
      ) {
        // Handle button responses separately
        if (req.body.entry[0].changes[0].value.messages[0].interactive.type == "button_reply"){
        let button_response =
          req.body.entry[0].changes[0].value.messages[0].interactive
            .button_reply.id;
        handleMessage(session, phone_number_id, from, null, button_response);
        }
        else if (req.body.entry[0].changes[0].value.messages[0].interactive.type === "list_reply") {
    // List response
        const list_response = req.body.entry[0].changes[0].value.messages[0].interactive.list_reply.id;
        handleMessage(session, phone_number_id, from, null, null, list_response);
        }
        
      }
    }
    res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
});

// Handles user messages based on session state
function handleMessage(session, phone_number_id, from, message, button_response, list_response) {
  if (!session.context.state) {
    // No state, set the initial state
    session.context.state = "INITIAL";
  }

  switch (session.context.state) {
    case "INITIAL":
      // User sent "hi", respond with a message and buttons
      if (message && message.toLowerCase() === "hi") {
        const response = "Hi! Are you here to apply for the Internship?";
        const buttons = [
          {
            payload: "APPLY_YES",
            title: "Yes"
          },
          {
            payload: "APPLY_NO",
            title: "No"
          }
        ];

        sendWhatsAppMessage(phone_number_id, from, response, buttons);
        session.context.state = "AWAITING_RESPONSE";
      }
      break;
    case "AWAITING_RESPONSE":
      if (button_response) {
        // Handle user's response
        if (button_response === "APPLY_YES") {
          // User selected "Yes" button
          // Ask for the user's name
          const response = "Please enter your name:";
          sendWhatsAppMessage(phone_number_id, from, response);
          session.context.state = "AWAITING_NAME";
        } else if (button_response === "APPLY_NO") {
          // User selected "No" button
          // Handle the logic for not applying to the internship
          const response =
            "Thank you for letting us know. If you change your mind, feel free to contact us.";
          sendWhatsAppMessage(phone_number_id, from, response);
          session.context.state = "INITIAL";
        }
      }
      break;
    case "AWAITING_NAME":
      // Validate the user's name
      if (!hasNumber(message)) {
        // Name is valid, ask for the email ID
        const response = "Please enter your email ID:";
        sendWhatsAppMessage(phone_number_id, from, response);
        session.context.name = message;
        session.context.state = "AWAITING_EMAIL";
      } else {
        // Name is not valid, ask for the name again
        const response = "Invalid name. Please enter your name:";
        sendWhatsAppMessage(phone_number_id, from, response);
      }
      break;
    case "AWAITING_EMAIL":
      // Validate the user's email ID
      if (isValidEmail(message)) {
        // Email ID is valid, ask for years of experience
        const response =
          "Please select how many years of experience you have with Python/JS/Automation Development:";
        const list = {
  header: {
    type: "text",
    text: "Experience"
  },
  footer: {
    text: "Choose"
  },
  action: {
    button: "View More",
    sections: [
      {
        title: "Years of Experience",
        rows: [
          {
            id: "1",
            title: "1 year"
          },
          {
            id: "2",
            title: "2 years"
          },
          {
            id: "3",
            title: "3 years"
          },
          {
            id: "4",
            title: "4 years"
          },
          {
            id: "5",
            title: "5 years"
          }
        ]
      }
    ]
  }
};

        sendWhatsAppMessage(phone_number_id, from, response, null, list);
        session.context.email = message;
        session.context.state = "AWAITING_EXPERIENCE";
      } else {
        // Email ID is not valid, ask for the email ID again
        const response = "Invalid email ID. Please enter your email ID:";
        sendWhatsAppMessage(phone_number_id, from, response);
      }
      break;
    case "AWAITING_EXPERIENCE":
      if (list_response) {
        // Handle the user's experience selection
        // Here, you can implement the logic to process the selected experience
        // For now, let's simply send a confirmation message
        const response = "Thanks for connecting. We will get back to you shortly!";
        sendWhatsAppMessage(phone_number_id, from, response);
        session.context.state = "INITIAL";
      }
      break;
    default:
      // Handle unknown session state or other messages
      const response = "Sorry, I didn't understand that. Please try again.";
      sendWhatsAppMessage(phone_number_id, from, response);
      session.context.state = "INITIAL";
      break;
  }
}



function sendWhatsAppMessage(
  phone_number_id,
  from,
  message,
  buttons = null,
  list = null
) {
  let payload;

  if (list) {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: from,
      type: "interactive",
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: list.header.text
        },
        body: {
          text: message
        },
        footer: {
          text: list.footer.text
        },
        action: {
          button: list.action.button,
          sections: list.action.sections.map((section) => ({
            title: section.title,
            rows: section.rows.map((row) => ({
              id: row.id,
              title: row.title,
              description: row.description
            }))
          }))
        }
      }
    };
  } else if (buttons && buttons.length > 0) {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: from,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: message
        },
        action: {
          buttons: buttons.map((button) => ({
            type: "reply",
            reply: {
              id: button.payload,
              title: button.title
            }
          }))
        }
      }
    };
  } else {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: from,
      type: "text",
      text: {
        body: message
      }
    };
  }

  axios
    .post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
      payload
    )
    .then((response) => {
      console.log("Message sent successfully:", response.data);
    })
    .catch((error) => {
      console.error("Error sending message:", error.response.data);
    });
}


// Retrieves the experience level from the button response
function getExperienceFromButtonResponse(button_response) {
  switch (button_response) {
    case "1":
      return "1 year";
    case "2":
      return "2 years";
    case "3":
      return "3 years";
    case "4":
      return "4 years";
    case "5":
      return "5 years";
    default:
      return null;
  }
}

// Checks if a string contains a number
function hasNumber(string) {
  return /\d/.test(string);
}

// Validates an email address
function isValidEmail(email) {
  // A basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
