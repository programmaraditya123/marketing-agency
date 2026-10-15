import Fastify from "fastify"

const app = Fastify({
    logger : true
})

app.get("/",async () => {
    return {
        success : true,
        message : "backend is runing"
    }
})

app.get("/health",async () => {
    return {
        success : true,
        message : "Health is good and fast which is my favourite"
    }
})

const start = async () => {
    try {
        const port = Number(process.env.X_ZOHO_CATALYST_LISTEN_PORT || 9000);
        await app.listen({
            port,
            host : "0.0.0.0"
        });
        
    } catch (error) {
        app.log.error(error)
        process.exit(1)
        
    }
}

start();