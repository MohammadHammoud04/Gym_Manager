const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();


router.post('/full-sync', async (req, res) => {
    console.log("📤 Starting Full Sync (Local → Cloud)...");

    const cloudUri = process.env.CLOUD_MONGO_URI;
    if (!cloudUri) {
        console.error("CLOUD_MONGO_URI is missing in .env");
        return res.status(500).json({ success: false, error: "Cloud URI missing" });
    }

    if (!mongoose.connection.readyState) {
        console.error("Local MongoDB is not connected");
        return res.status(500).json({ success: false, error: "Local DB not connected" });
    }

    let cloudConn;

    try {
        cloudConn = await mongoose.createConnection(cloudUri, {
            serverSelectionTimeoutMS: 15000
        }).asPromise();

        console.log("Connected to Cloud DB");

        const localCollections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Local collections found: ${localCollections.map(c => c.name).join(', ')}`);

        for (let col of localCollections) {
            const name = col.name;
            if (name.startsWith('system.')) continue;

            try {
                console.log(`Processing collection: ${name}`);

                const localData = await mongoose.connection.db.collection(name).find({}).toArray();
                const cloudCollection = cloudConn.db.collection(name);

                await cloudCollection.deleteMany({});
                console.log(`Cleared cloud collection: ${name}`);

                if (localData.length > 0) {
                    await cloudCollection.insertMany(localData);
                    console.log(`Inserted ${localData.length} documents into cloud collection: ${name}`);
                } else {
                    console.log(`No documents to sync for collection: ${name}`);
                }
            } catch (colErr) {
                console.error(`Error syncing collection ${name}:`, colErr);
            }
        }

        res.json({ success: true, message: "Full sync completed successfully" });
    } catch (err) {
        console.error("Full sync failed:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (cloudConn) {
            await cloudConn.close();
            console.log("Cloud connection closed");
        }
    }
});


router.post('/pull-from-cloud', async (req, res) => {
    console.log("📥 Starting Pull from Cloud (Cloud → Local)...");

    const cloudUri = process.env.CLOUD_MONGO_URI;
    if (!cloudUri) {
        console.error("CLOUD_MONGO_URI is missing in .env");
        return res.status(500).json({ success: false, error: "Cloud URI missing" });
    }

    if (!mongoose.connection.readyState) {
        console.error("Local MongoDB is not connected");
        return res.status(500).json({ success: false, error: "Local DB not connected" });
    }

    let cloudConn;

    try {
        cloudConn = await mongoose.createConnection(cloudUri, {
            serverSelectionTimeoutMS: 15000
        }).asPromise();

        console.log("Connected to Cloud DB");

        const cloudCollections = await cloudConn.db.listCollections().toArray();
        console.log(`Cloud collections found: ${cloudCollections.map(c => c.name).join(', ')}`);

        for (let col of cloudCollections) {
            const name = col.name;
            if (name.startsWith('system.')) continue;

            try {
                console.log(`Processing collection: ${name}`);

                const cloudData = await cloudConn.db.collection(name).find({}).toArray();
                const localCollection = mongoose.connection.db.collection(name);

                await localCollection.deleteMany({});
                console.log(`Cleared local collection: ${name}`);

                if (cloudData.length > 0) {
                    await localCollection.insertMany(cloudData);
                    console.log(`Inserted ${cloudData.length} documents into local collection: ${name}`);
                } else {
                    console.log(`No documents to restore for collection: ${name}`);
                }
            } catch (colErr) {
                console.error(`Error restoring collection ${name}:`, colErr);
            }
        }

        res.json({ success: true, message: "Local DB updated from Cloud successfully" });
    } catch (err) {
        console.error("Pull from cloud failed:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (cloudConn) {
            await cloudConn.close();
            console.log("Cloud connection closed");
        }
    }
});

module.exports = router;
