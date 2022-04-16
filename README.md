This bot acts like a webhook handler for alertmanager.
It sends a message to a chat when a new alert is received.
It also supports commands and can show alerts that are currently active.

## Configuration

Configuration is done via environment variables.

- `BOT_TOKEN`: the token of the bot you want to use.
- `ADMIN_ID`: list of admin ids, separated by `;`. These accounts can send commands to the bot.
- `CHAT_ID`: list of chat ids, separated by `;`. These chats are going to always receive the alerts. These chats cannot
  unsubscribe with a command.
- `ALERTMANAGER_URL`: the url of the alertmanager instance. Required for commands like `/alerts` to work.
- `FORMATTER_PATH`: the path to a script that generates messages from alerts. See below for details. If not defined,
  default formatted is used.
- `HTTP_PORT`: the port the http server listens on. Defaults to 8080.

## Supported commands

- `/start`: subscribes current chat to alerts.
- `/stop`: unsubscribes current chat from alerts.
- `/alerts`: lists active alerts.
- `/chats`: lists subscribed chats.

## Formatter

Formatting alerts is performed with a formatter script.
This is a JS module that can export formatting functions.

You can customize either entire message sent to a chat or alerts displayed as newline-separated blocks in a message.
In the latter case, bot will manage message length limits by itself.

To customize an alert, your module should export a function named `alert`:

For example:

```javascript
export function alert(alert, tools) {
  return `${alert.labels.alertname}: ${alert.annotations.summary}`;
}
```

It is going to be called with following arguments:
- `alert`: the alert object, described [here](./src/webhook-data.ts) as `Alert` interface.
- `tools`: object with helper functions.
  - `tools.formatDuration(durationInMs)`: returns a human-readable string representing a duration in milliseconds.

If a function exporting `webhook` is defined, it is used to format entire message.

Arguments received by this function:
- `webhook`: webhook data, described [here](./src/webhook-data.ts) as `Webhook` interface.
- `tools`: object with helper functions.
  - `tools.formatDuration(durationInMs)`: returns a human-readable string representing a duration in milliseconds.
  - `tools.formatAlert(alert)`: returns a formatted alert using a selected alert formatter.
  - `tools.formatAlertGroup(alerts, maxLength, alreadyHiddenAlerts)`: returns a formatted list of alerts, separated by newlines.
    - `alerts`: array of alerts.
    - `maxLength`: max allowed text length. Alerts that are not fitting into the message are hidden, and number of hidden messages will be appended to resulting text.
    - `alreadyHiddenAlerts`: number of alerts that are already hidden (by alertmanager). This number is specified in `truncatedAlerts` property of webhook data.

## Docker compose example

```
alertmanager-telegram:
  image: ghcr.io/zenwarr/alertmanager-tg:latest
  restart: unless-stopped
  volumes:
    - alertmanager-telegram-storage:/alertmanager-tg
  environment:
    - BOT_TOKEN
    - CHAT_ID
    - ADMIN_ID
    - ALERTMANAGER_URL=http://alertmanager:9093
```

## Configure alertmanager

Example configuration:

```yaml
receivers:
  - name: 'telegram'
    webhook_configs:
      - send_resolved: true
        url: 'http://alertmanager-telegram:8080'

route:
  receiver: 'telegram'
```
