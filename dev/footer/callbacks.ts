interface NetworkSetPos {
    coords: Vector;
    position: number;
}
//Set pos1
Callback.addCallback("ItemUseLocalServer", function (coords, item, block, isExternal, player) {
    if (WorldEdit.enabled() && item.id == wand_id && WorldEdit.enabledWand()) {
        Commands.invoke("//pos1", [coords.x.toString(), coords.y.toString(), coords.z.toString()]);
        Game.prevent();
    }
});
//Set pos2
Callback.addCallback("DestroyBlock", function (coords, block, player) {
    const actor = new PlayerActor(player);
    if (WorldEdit.enabled() && actor.getGameMode() == EGameMode.CREATIVE && Entity.getCarriedItem(player).id == wand_id && WorldEdit.enabledWand()) {
        const client = Network.getClientForPlayer(player);
        if (client) {
            client.send("worldedit.setpos", {
                coords: coords,
                position: 2
            });
            Game.prevent();
        }
    }
});
Callback.addCallback("DestroyBlockStart", function (coords, block, player) {
    const actor = new PlayerActor(player);
    if (WorldEdit.enabled() && actor.getGameMode() == EGameMode.SURVIVAL && Entity.getCarriedItem(player).id == wand_id && WorldEdit.enabledWand()) {
        const client = Network.getClientForPlayer(player);
        if (client) {
            client.send("worldedit.setpos", {
                coords: coords,
                position: 2
            });
            Game.prevent();
        }
    }
});

//Set posN
Network.addClientPacket<NetworkSetPos>("worldedit.setpos", function (data) {
    if (!WorldEdit.enabled()) return;

    const coords: Vector = data.coords;

    Commands.invoke("//pos" + data.position,
        [coords.x.toString(), coords.y.toString(), coords.z.toString()]
    );
    Game.prevent();
});

Callback.addCallback("LevelLeft", function () {
    WorldEdit.clear();
});
