const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const runMigration = async () => {
  console.log('🚀 Starting pure raw MongoDB migration of base64 songs...');
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    console.log('🍃 Connected directly to MongoDB via Native Driver.');

    const db = client.db();
    const songsCol = db.collection('songs');

    // 1. Find matching song IDs by projecting only _id and providerSongId
    const matchingSongs = await songsCol
      .find({ previewUrl: { $regex: /^data:/ } }, { projection: { _id: 1, providerSongId: 1, title: 1 } })
      .toArray();

    console.log(`Found ${matchingSongs.length} song(s) with base64 data to migrate.`);

    let count = 0;
    for (const meta of matchingSongs) {
      console.log(`[${count + 1}/${matchingSongs.length}] Fetching raw document: "${meta.title}"...`);
      
      const song = await songsCol.findOne({ _id: meta._id });
      if (!song) continue;

      const base64Audio = song.previewUrl;
      const playUrl = `/api/v1/music/songs/${song.providerSongId}/play`;

      console.log(`Updating "${song.title}" (~${Math.round(base64Audio.length / 1024 / 1024)} MB) to streaming path...`);

      // Update document using native updateOne
      await songsCol.updateOne(
        { _id: song._id },
        {
          $set: {
            audioData: base64Audio,
            previewUrl: playUrl,
            externalUrl: song.externalUrl && song.externalUrl.startsWith('data:') ? playUrl : (song.externalUrl || '')
          }
        }
      );

      count++;
      console.log(`✅ [${count}/${matchingSongs.length}] Migrated: "${song.title}" successfully.`);
    }

    console.log(`🎉 Pure MongoDB migration completed successfully! Updated ${count} songs.`);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
};

runMigration();
