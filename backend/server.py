import asyncio
import json
import websockets

connected_users = {}  # username -> websocket


async def broadcast_users():
    user_list = list(connected_users.keys())
    message = json.dumps({"type": "users", "users": user_list})
    if connected_users:
        tasks = [ws.send(message) for ws in connected_users.values()]
        await asyncio.gather(*tasks, return_exceptions=True)


async def handler(websocket):
    username = None
    try:
        # First message must be username
        username = await websocket.recv()
        
        # Check if username already taken
        if username in connected_users:
            await websocket.close(reason="Username taken")
            return

        connected_users[username] = websocket
        print(f"{username} connected")
        await broadcast_users()

        async for message in websocket:
            try:
                data = json.loads(message)
                to_user = data.get("to")
                msg = data.get("message")
                
                print(f"Message from {username} to {to_user}: {msg}")

                if to_user in connected_users:
                    await connected_users[to_user].send(
                        json.dumps({
                            "from": username,
                            "message": msg
                        })
                    )
                else:
                    print(f"User {to_user} not found in connected_users: {list(connected_users.keys())}")
                    await websocket.send(json.dumps({
                        "from": "System",
                        "message": f"User '{to_user}' is not online."
                    }))
            except Exception as e:
                print(f"Error processing message: {e}")
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        if username and username in connected_users:
            del connected_users[username]
            print(f"{username} disconnected")
            await broadcast_users()


async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        print("Server running on ws://0.0.0.0:8765")
        await asyncio.Future()  # run forever


asyncio.run(main())
