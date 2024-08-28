import express from 'express';
import kue from 'kue';
import redis from 'redis';
import { promisify } from 'util';

// Redis client setup
const client = redis.createClient();
const getAsync = promisify(client.get).bind(client);

// Key for storing available seats
const seatsKey = 'available_seats';

// Initialize reservation status
let reservationEnabled = false;

// Function to set available seats in Redis
function reserveSeat(number) {
  client.set(seatsKey, number);
}

// Function to get current available seats from Redis
async function getCurrentAvailableSeats() {
  const availableSeats = await getAsync(seatsKey);
  return availableSeats ? Number(availableSeats) : 0;
}

// Handle Redis errors
client.on('error', (error) => {
  console.error(`Redis client not connected to the server: ${error.message}`);
});

// Log Redis connection status and initialize available seats
client.on('connect', () => {
  console.log('Redis client connected to the server');
  reserveSeat(50); // Set initial available seats
  reservationEnabled = true;
});

// Kue queue setup
const queue = kue.createQueue();
const queueName = 'reserve_seat';

// Express server setup
const app = express();
const port = 1245;

// Start the Express server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

// Route to get the number of available seats
app.get('/available_seats', async (req, res) => {
  const availableSeats = await getCurrentAvailableSeats();
  res.json({ numberOfAvailableSeats: availableSeats });
});

// Route to reserve a seat
app.get('/reserve_seat', (req, res) => {
  if (!reservationEnabled) {
    res.json({ status: 'Reservations are blocked' });
    return;
  }

  const jobFormat = {}; // Define job format here if needed

  // Create and save a reservation job to the queue
  const job = queue.create(queueName, jobFormat).save((err) => {
    if (err) {
      res.json({ status: 'Reservation failed' });
    } else {
      res.json({ status: 'Reservation in process' });
    }
  });

  // Log job status
  job.on('complete', () => {
    console.log(`Seat reservation job ${job.id} completed`);
  });

  job.on('failed', (errorMessage) => {
    console.log(`Seat reservation job ${job.id} failed: ${errorMessage}`);
  });
});

// Route to start processing jobs in the queue
app.get('/process', async (req, res) => {
  queue.process(queueName, async (job, done) => {
    let availableSeats = await getCurrentAvailableSeats();

    if (availableSeats <= 0) {
      done(Error('Not enough seats available'));
      return;
    }

    availableSeats -= 1; // Reserve one seat
    reserveSeat(availableSeats);

    if (availableSeats <= 0) {
      reservationEnabled = false;
    }

    done();
  });

  res.json({ status: 'Queue processing' });
});

