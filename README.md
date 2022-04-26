# book-and-study-api

## scripts

- here in this project we use yarn as package manager

### `yarn`

- execute this to install all dependencies

### `yarn generate`

- with this command you will generate prisma client
- after this you will be able to do CRUD operations

### `yarn dev`

- this command will execute express app together with svix listener to `http:localhost:4000/user-created`
- svix is listening because it will connect authenticated user with DB (mongodb in our case)

This project has dependencies

- @clerk/clerk-sdk-node
- prisma
- mongodb

To be able to execute API server successfully you need to have clerk application together with mongodb-atlas and also you need to create .env file with variables

- **CLERK_API_KEY**
- **MONGO_DB**
- **SVIX_SECRET**

#### MONGO_DB

- after you successfully create project in the mongodb-atlas you will go to the **DATABASE ACCESS** and create user under your name with password which you will need to copy. Then you will click on the **DATABASE** and then you will have there button connect go through this wizard and at the end you should see url like this **mongodb+srv://<username>:<password>@<db-url>/<db-name>?retryWrites=true&w=majority**. Instead of username use your actual name of user you created together with the password you copied

#### SVIX_SECRET

this env you can access in your clerk application

- in integrations and when you will click on Svix integration
- after that you will create endpoint which will have its own secret (this you will use)
