const { default: express } = await import('express');
import path from 'path';
import { fileURLToPath } from 'url';
import patternsOfLife from './app/routes/patternsOfLife.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use("/patternsOfLife", patternsOfLife);

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});