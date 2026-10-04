// internal imports
import { app } from './app.js';

// port
const port = Number(process.env.PORT ?? 5001);
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
