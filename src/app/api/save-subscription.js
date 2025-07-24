// app/api/save-subscription/route.js

export async function POST(request) {
  try {
    const body = await request.json()

    // For debugging
    console.log("Received push subscription:", body)

    // Example: Save to a file, database, or in-memory (for dev)
    // In production, you'd store this in a DB
    // await saveToDatabase(body)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Error saving subscription:", error)

    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
