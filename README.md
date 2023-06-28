# Notbot-Chatbot-for-Internship-tasks

This is a simple WhatsApp chatbot implementation using the WhatsApp Business API. The chatbot listens for incoming webhook requests from the WhatsApp API and handles user messages based on the session state. It includes features such as handling button responses, validating user inputs, and persisting user data in a MongoDB database.

## Prerequisites

Before running the chatbot, ensure you have the following prerequisites:

- Node.js (v12 or higher)
- npm (Node Package Manager)
- MongoDB
- WhatsApp Business API Account (Obtained from [Facebook for Business](https://www.facebook.com/business/products/whatsapp/business-api))

## Installation

1. Clone the repository:

   ```bash
    git clone https://github.com/your-username/your-repo.git](https://github.com/suhasml/Notbot-Chatbot-for-Internship-tasks.git
   ```
2. Change to the project directory:

   ```bash
   cd Notbot-Chatbot-for-Internship-tasks
   ```
3. Install the dependencies:
  
    ```bash
   npm install
   ```
4. Set up environment variables:

-> Create a .env file in the project root directory. <br/>
-> Open the .env file and add the following environment variables:<br/>
```bash
WHATSAPP_API_URL=your_whatsapp_api_url
WHATSAPP_API_TOKEN=your_whatsapp_api_token
MONGODB_URI=your_mongodb_uri
MONGODB_DB_NAME=your_database_name
```
## Usage

1. Start the server:

   ```bash
     npm start
   ```

