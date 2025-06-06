import 'dotenv/config'
import express from 'express'
import OpenAI from 'openai'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import open from 'open'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
app.use(express.json())
app.use(express.static(__dirname))

// TODO: use Allstate's OpenAI API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// -------------------------------------------------------------------------------------------- //
// THIS WOULD EXIST IN A SEPARATE MICROSERVICE (MPC SERVER)
// THE MICROSERVICE WOULD NOT BE LIMITED TO A SINGULAR FUNCTION (ENCAPSULATE BY RESPONSIBILITY)
const getCookieFunction = {
    name: 'get_cookie',
    description: 'Returns a cookie of a particular color and size',
    parameters: {
        type: "object",
        properties: {
            color: { type: "string" },
            size: { type: "string" }
        },
        required: ["color", "size"]
    }
}

async function invokeGetCookieRPC(color, size) {
    // replace with your actual RPC call
    return `Here is your ${size}, ${color} cookie! 🍪`
}

// WE COULD IMAGINE THE COOKIE MICROSERVICE HAVING MULTIPLE FUNCTIONS LIKE
// get_cookie, get_cookie_ingredients, get_cookie_nutrition, etc.

// -------------------------------------------------------------------------------------------- //


// THIS REPRESENTS THE "MVC CLIENT" IN THE MICROSERVICE ARCHITECTURE
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message
        const history = req.body.history || []
        
        const systemMessages = [
            { role: 'system', content: 'Do not infer the size of the cookie or color.' },
            { role: 'system', content: 'Do not pick the size or color of the cookie.' },
            { role: 'system', content: 'You are a cookie salesperson. You are trying to sell cookies to a customer.' },
            { role: 'system', content: 'You are a southerner and can\'t talk any other way.' },
            { role: 'system', content: 'You get an attitude when someone doesn\'t order a cookie quickly enough and you rush them.'},
            { role: 'system', content: 'Increase level of frustration with each user message that is not a cookie order.'},
            { role: 'system', content: 'Get frustrated fast.'},
            { role: 'system', content: 'After a cookie order, consider that a new size and color will be needed for the next cookie.' },
            { role: 'system', content: 'Make things cute with tons of emojis! 🍪✨ This is geared towards small children, so keep it simple and fun!' },
            { role: 'system', content: 'We only provide cookies here and cannot assist with anything else.' }
        ]

        // WHAT WOULD THIS LOOK LIKE WHEN SEGREGATED INTO MICROSERVICES?
        const messages = [
            ...systemMessages,
            ...history,
            { role: 'user', content: `You have these MCP functions available: ${JSON.stringify([getCookieFunction])}\n\nUser message: ${userMessage}` }
        ]

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            functions: [getCookieFunction],
            function_call: 'auto'
        })

        const message = completion.choices[0].message

        if (message.function_call) {
            const args = JSON.parse(message.function_call.arguments)
            const { color, size } = args
            const result = await invokeGetCookieRPC(color, size)
            res.json({ reply: result })
        } else {
            res.json({ reply: message.content })
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing your request.' })
    }
})

const PORT = 3000
app.listen(PORT, () => {
    console.log(`Server is running and listening on port ${PORT}`)
    open(`http://localhost:${PORT}`)  
})