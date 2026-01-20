const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

//MIRROR LOCAL TO CLOUD
router.post('/full-sync', async (req, res) => {
    console.log("📤 Mirroring Local DB to Cloud...");
    let cloudConn;
    try {
        const cloudUri = process.env.ATLAS_URI || process.env.CLOUD_MONGO_URI; 
        if (!cloudUri) throw new Error("Cloud URI missing in .env");

        cloudConn = await mongoose.createConnection(cloudUri).asPromise();
        const collections = await mongoose.connection.db.listCollections().toArray();

        for (let col of collections) {
            const collectionName = col.name;
            if (collectionName.startsWith('system.')) continue;

            const localData = await mongoose.connection.db.collection(collectionName).find({}).toArray();
            const cloudCollection = cloudConn.db.collection(collectionName);
            
            await cloudCollection.deleteMany({});
            if (localData.length > 0) {
                await cloudCollection.insertMany(localData);
            }
            console.log(`Mirrored collection: ${collectionName}`);
        }

        res.json({ success: true, message: "Mirroring successful!" });
    } catch (err) {
        console.error("Mirror Sync Error:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (cloudConn) await cloudConn.close();
    }
});

//PULL FROM CLOUD TO LOCAL (Restoration)
router.post('/pull-from-cloud', async (req, res) => {
    console.log("Restore request received");
    let cloudConn;

    try {
        const cloudUri = process.env.CLOUD_MONGO_URI; 
        
        if (!cloudUri) {
            console.log("Error: CLOUD_MONGO_URI is missing in .env");
            return res.status(500).json({ success: false, error: "Cloud URI missing" });
        }

        console.log("Connecting to cloud database...");
        
        // Establish temporary cloud connection
        cloudConn = await mongoose.createConnection(cloudUri, {
            serverSelectionTimeoutMS: 5000 
        }).asPromise();
        
        console.log("Cloud connection established successfully");

        const cloudDb = cloudConn.db;
        // List collections specifically from the cloud database
        const cloudCollections = await cloudDb.listCollections().toArray();
        console.log("Collections found in cloud: " + cloudCollections.length);

        for (let col of cloudCollections) {
            const name = col.name;
            
            // Skip system collections
            if (name.startsWith('system.')) continue;

            console.log("Processing collection: " + name);
            
            // Fetch data from cloud
            const cloudData = await cloudDb.collection(name).find({}).toArray();

            // Clear local collection and insert cloud data
            await mongoose.connection.db.collection(name).deleteMany({});
            
            if (cloudData.length > 0) {
                await mongoose.connection.db.collection(name).insertMany(cloudData);
                console.log("Restored " + cloudData.length + " documents to " + name);
            } else {
                console.log("Collection " + name + " was empty in cloud");
            }
        }

        res.json({ success: true, message: "Local data updated from Cloud" });

    } catch (err) {
        console.log("Detailed Server Error:");
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (cloudConn) {
            await cloudConn.close();
            console.log("Cloud connection closed");
        }
    }
});

module.exports = router;