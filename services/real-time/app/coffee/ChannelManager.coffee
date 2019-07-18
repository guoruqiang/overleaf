logger = require 'logger-sharelatex'
metrics = require "metrics-sharelatex"
settings = require "settings-sharelatex"

ClientMap = new Map() # for each redis client, stores a Set of subscribed channels

# Manage redis pubsub subscriptions for individual projects and docs, ensuring
# that we never subscribe to a channel multiple times. The socket.io side is
# handled by RoomManager.

module.exports = ChannelManager =
    _createNewClientEntry: (rclient) ->
        ClientMap.set(rclient, new Set()).get(rclient)

    subscribe: (rclient, baseChannel, id) ->
        existingChannelSet = ClientMap.get(rclient) || @_createNewClientEntry(rclient)
        channel = "#{baseChannel}:#{id}"
        if existingChannelSet.has(channel)
            logger.error {channel}, "already subscribed"
        else
            rclient.subscribe channel
            existingChannelSet.add(channel)
            logger.log {channel}, "subscribed to new channel"
            metrics.inc "subscribe.#{baseChannel}"

    unsubscribe: (rclient, baseChannel, id) ->
        existingChannelSet = ClientMap.get(rclient)
        channel = "#{baseChannel}:#{id}"
        if !existingChannelSet.has(channel)
            logger.error {channel}, "not subscribed, cannot unsubscribe"
        else
            rclient.unsubscribe channel
            existingChannelSet.delete(channel)
            logger.log {channel}, "unsubscribed from channel"
            metrics.inc "unsubscribe.#{baseChannel}"

    publish: (rclient, baseChannel, id, data) ->
        if id is 'all' or !settings.publishOnIndividualChannels
            channel = baseChannel
        else
            channel = "#{baseChannel}:#{id}"
        # we publish on a different client to the subscribe, so we can't
        # check for the channel existing here
        rclient.publish channel, data