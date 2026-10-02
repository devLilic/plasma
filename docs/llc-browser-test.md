# Test LLC from Plasma

Plasma’s authenticated **Test LLC** page sends requests directly from the browser to the LiveBoard Lab Controller (LLC) at `http://127.0.0.1:47833`. Laravel does not receive or proxy the token or these commands.

## Use

1. Start LLC on the computer running the browser and open **Test LLC** from the Plasma user menu.
2. Copy the API token from LLC Diagnostics, paste it into the password field, and select **Conectează**.
3. After the service identity and protocol version are checked, edit **Titlu** and **Kicker**, then use **PLAY Titlu 4** or **STOP Headline**. PLAY always sends both values together, including empty strings. The page displays the active text from the headline buffer when LLC reports it.

The **Generează titlu** and **Generează kicker** buttons choose different Romanian test samples locally in the page. They do not call an AI or any external service, and generating text never sends PLAY automatically. The initial samples include Romanian diacritics and long text to help check how the graphic renders them.

The token is held in page memory and, when browser storage is available, `sessionStorage` for this tab session. It is never sent to Plasma’s server or written to application logs. Closing the tab ends the saved session. Changing the token clears the connection and requires a new connection check. Repeating PLAY with the same text for the active item is a no-op. Editing the title or kicker and pressing PLAY again updates the active item’s buffers; use STOP before PLAY when you want to start it again.

The command result confirms processing by LLC only. It does not confirm playback on LiveBoard. A timeout can leave the command outcome uncertain; use **Conectează** to read the current state again, with no automatic command retry.

## Network and browser requirements

The address `127.0.0.1` refers to the computer running the browser. If Plasma is served by another computer, LLC still needs to run on the user’s browser computer at that address. The browser must allow Plasma’s origin to access the local service, including any local network access permission prompt. A browser may block this HTTP local request from an HTTPS Plasma page depending on its local-network and mixed-content policies. Keep the browser’s normal security protections enabled; use an origin and browser configuration that allow local network access, then verify LLC is running and reconnect.

If the Plasma server origin changes, add that exact origin (including its scheme) to `allowedOrigins` in LLC’s `bridge-settings.json`, then restart LLC. The endpoint stays `http://127.0.0.1:47833`; it is the page origin that LLC must allow. For future HTTPS Plasma deployments, use the browser’s normal local network access permission flow and ensure the browser permits the local HTTP request from that HTTPS origin.
