# Colmapp Backend

This repository contains the backend code for the **Colmapp** project.


## Getting Started

To run the backend locally:

1. Clone the repository:
    ```bash
    git clone https://github.com/balkacer/colmapp-backend.git
    cd colmapp-backend
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up environment variables:
    - Copy `.env.example` to `.env` and update the values as needed.

4. Start the development server:
    ```bash
    npm run dev
    ```

## Project Structure

```
backend/
├── apps
│   ├── api-gateway
│   ├── auth-service
│   ├── files-service
│   ├── notifications-service
│   ├── orders-service
│   ├── products-service
│   └── providers-service
├── libs
├── package.json
└── README.md
```

## API Documentation

The API endpoints are documented in the [API.md](API.md) file.

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements.

## License

This project is licensed under the MIT License.