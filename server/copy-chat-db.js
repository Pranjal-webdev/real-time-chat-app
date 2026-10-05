import mongoose from "mongoose";
import dns from "node:dns";
import dotenv from "dotenv";

dotenv.setServers?.(["8.8.8.8", "1.1.1.1"]);
dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const localURI = "mongodb://127.0.0.1:27017/real_time_chat";

const atlasURI = process.env.MONGO_URI;

const copyDatabase = async () => {
    let localDB;
    let atlasDB;

    try {
        console.log("Connecting to Local MongoDB...");

        localDB = await mongoose.createConnection(localURI).asPromise();

        console.log("Local MongoDB Connected");

        console.log("Connecting to MongoDB Atlas...");

        atlasDB = await mongoose.createConnection(atlasURI, {
            dbName: "real_time_chat"
        }).asPromise();

        console.log("MongoDB Atlas Connected");

        const collections = await localDB.db.listCollections().toArray();

        for (const collection of collections) {
            const collectionName = collection.name;

            const localCollection = localDB.db.collection(collectionName);
            const atlasCollection = atlasDB.db.collection(collectionName);

            const documents = await localCollection.find({}).toArray();

            console.log(
                `Copying ${collectionName}: ${documents.length} documents`
            );

            await atlasCollection.deleteMany({});

            if (documents.length > 0) {
                await atlasCollection.insertMany(documents);
            }

            console.log(`${collectionName} copied successfully`);
        }

        console.log("\nAll real_time_chat data copied successfully!");

        await localDB.close();
        await atlasDB.close();

    } catch (error) {
        console.error("\nCOPY ERROR:");
        console.error(error);

        if (localDB) await localDB.close();
        if (atlasDB) await atlasDB.close();

        process.exit(1);
    }
};

copyDatabase();