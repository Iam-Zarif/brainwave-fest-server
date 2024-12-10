const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASS}@cluster0.wbdue.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    bufferCommands: false, // Disable command buffering
    connectTimeoutMS: 30000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
});

let isConnected = false;

const connectDB = async () => {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log("MongoDB connected successfully!", uri);
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error.message);
      throw new Error("Database connection failed");
    }
  }
};

const getCollection = async (dbName, collectionName) => {
  await connectDB();
  const db = client.db(dbName);
  return db.collection(collectionName);
};

process.on("SIGINT", async () => {
  console.log("Closing MongoDB connection...");
  await client.close();
  process.exit();
});

module.exports = { connectDB, getCollection };
