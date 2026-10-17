// internal imports
import { app } from './app.js';

const port = Number(process.env.PORT ?? 5001);

app.listen(port, '0.0.0.0', () => {
	console.log(`Server listening on port ${port}`);
});
