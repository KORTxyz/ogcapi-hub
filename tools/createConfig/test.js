
    import SPL from './index.js';

    export default async () => {
      try {

        const spl = await SPL();

        window.db = await spl.db()


      } catch (err) {
        console.log(err);
      }
    };
