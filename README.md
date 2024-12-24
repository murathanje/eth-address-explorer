# Ethereum Address Explorer

## Description
A web application for exploring and analyzing Ethereum addresses. This tool provides a simple and intuitive interface to retrieve and display information about Ethereum addresses.

## Features
- Search and explore Ethereum addresses
- Static file serving for frontend
- RESTful API endpoints for address-related queries
- Health check endpoint
- CORS support for cross-origin requests

## Prerequisites
- Node.js (v14 or later)
- npm (Node Package Manager)

## Technologies Used
- Express.js
- CORS
- Static file serving

## Installation
1. Clone the repository
```bash
git clone <your-repo-url>
cd ethereum-address-explorer
```

2. Install dependencies
```bash
npm install
```

## Configuration
The project uses environment variables defined in `.env`:
- `NODE_ENV`: Set to `production`
- `PORT`: Default is `3000`

## Running the Application
### Local Development
```bash
npm start
```

### API Endpoints
- `GET /`: Main application page
- `GET /health`: Health check endpoint
- `GET /api/address/*`: Address-related routes

## Project Structure
- `server.js`: Main Express.js application entry point
- `routes/addressRoutes.js`: Address-specific route handlers
- `templates/`: Frontend HTML and static files

## Deployment
- Deployed on Vercel
- Configured with `vercel.json`
- Automatic builds and deployments

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AddressLookup`)
3. Commit your changes (`git commit -m 'Add advanced address lookup'`)
4. Push to the branch (`git push origin feature/AddressLookup`)
5. Open a Pull Request

## License
MIT License

## Contact
Reach out for any questions or support related to the Ethereum Address Explorer. 