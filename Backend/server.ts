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

const start = async () => {
    try {
        await app.listen({
            port : Number(process.env.PORT ?? process.env.X_ZOHO_CATALYST_LISTEN_PORT ?? 8080),
            host : "0.0.0.0"
        });
        
    } catch (error) {
        app.log.error(error)
        process.exit(1)
        
    }
}

start();