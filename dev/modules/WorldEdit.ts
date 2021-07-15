//General
namespace WorldEdit {
    let _vectors: Vector[] = [];

    export function setPosition(pos: number, point: Vector): void;
    export function setPosition(pos: number, point: Vector, invokeCallback: false): void;
    export function setPosition(pos: number, point: Vector, invokeCallback: boolean = true) {
        _vectors[pos] = copyObject({}, point);
        if (invokeCallback !== false)
            Callback.invokeCallback("worldedit.set_position", pos, _vectors[pos]);
    }
    Callback.addCallback("worldedit.set_position", function (pos: number) {
        Callback.invokeCallback("worldedit.set_position_" + pos, _vectors[pos]);
    });

    export function getPosition(pos: number): Vector {
        if (_vectors[pos].x != Infinity)
            return copyObject({}, _vectors[pos]);

        for (let i = 0, l = _vectors.length; i < l; i++)
            if (_vectors[i].x != Infinity)
                return copyObject({}, _vectors[i]);

        return null;
    }

    export function getSizeArea(): number {
        const pos1 = getPosition(0);
        const pos2 = getPosition(1);
        return (Math.abs(pos1.x - pos2.x) + 1) * (Math.abs(pos1.y - pos2.y) + 1) * (Math.abs(pos1.z - pos2.z) + 1);
    }

    export function checkValidPosition(): boolean {
        return getPosition(0).x != Infinity
    }

    let _limit: number = -1;
    export function checkValidLimit(limit: number): boolean {
        return _limit == -1 || limit <= _limit;
    }
    export function setLimit(limit: number): void {
        _limit = limit;
    }

    let _enabledWand: boolean = true;
    let _enabledWandForActors: Dict<boolean> = {};
    export function enabledWand(actor: number = null): boolean {
        return actor ? (_enabledWandForActors[actor] || false) : _enabledWand;
    }
    export function setEnableWand(enable: boolean) {
        _enabledWand = enable;
        Network.sendToServer("worldedit.enablewand", { enable: enable });
    }
    export function enableWand(): void {
        setEnableWand(true);
    }
    export function disableWand(): void {
        setEnableWand(false);
    }
    export function toggleWand(): void {
        setEnableWand(!_enabledWand);
    }
    Network.addServerPacket<{ enable: boolean }>("worldedit.enablewand", function (client, data) {
        _enabledWandForActors[client.getPlayerUid()] = data.enable;
    });

    export function parseBlockInfo(info: string, defaultData: number = 0): [number, number] {
        const block = info.split(":");

        const data = block[1] ? parseInt(block[1]) : defaultData;

        let id = parseInt(block[0]);
        if (isNaN(id))
            id = BlockID[block[0]] || BlockID[block[0].replace("block_", "")];
        if (id === null)
            throw new Error(`Unknown id "${block[0]}"`);
        if (Network.inRemoteWorld())
            id = Network.localToServerId(id);

        return [id, data];
    }

    let _enabled: boolean = false;
    let _errorEnabled: string = null;
    export function enabled() {
        return _enabled;
    }

    Callback.addCallback("LevelSelected", function () {
        _enabled = true;
    });
    Callback.addCallback("ConnectingToHost", function () {
        Network.sendToServer("worldedit.connect", __mod__.getMultiplayerVersion());
    });
    Callback.addCallback("LevelDisplayed", function () {
        if (!_enabled)
            Game.message(_errorEnabled ? _errorEnabled : Translation.translate("WorldEdit was not found on the server."));
        else {
            Game.message(Translation.translate("WorldEdit %version% is enabled!").replace("%version%", <string><any>__mod__.getMultiplayerVersion()));
            enableWand();
        }
    });

    Network.addServerPacket<java.lang.String>("worldedit.connect", function (client, data) {
        const version = __mod__.getMultiplayerVersion();

        if (data == version) {
            client.send("worldedit.connected", { success: 1 });
        } else
            client.send("worldedit.connected", version);

    });
    Network.addClientPacket<{ success?: 1 } | java.lang.String>("worldedit.connected", function (data) {
        if (data instanceof java.lang.String || typeof data == "string") {
            _errorEnabled = Translation.translate("Different versions of WorldEdit.\nWorldEdit features are disabled.\nYour version is %version%.\nServer version: %server%.")
                .replace("%version%", <string><any>__mod__.getMultiplayerVersion())
                .replace("%server%", <string><any>data);
        } else {
            _enabled = true;
        }
    });


    export function clear(): void {
        const l = _vectors.length;
        for (let i = 0; i < l; i++)
            setPosition(i, { x: Infinity, y: Infinity, z: Infinity });

        enableWand();
        _enabled = false;
        _errorEnabled = null;
        _enabledWandForActors = {};
    }
}

//History
namespace WorldEdit {

    export type HistoryItem = { command: string, data: any };
    class HistoryStack {
        private list: HistoryItem[] = [];
        private index: number = 0;
        private count: number = 0;

        public push(cmd: HistoryItem): void;
        public push(cmd: string, data: any): void;
        public push(cmd: string | HistoryItem, data?: any): void {
            if (typeof cmd == "string")
                cmd = { command: cmd, data: data };

            this.list[this.index++] = cmd;
            this.count = this.index;
        }

        public send(client: NetworkClient, cmd: HistoryItem): void;
        public send(client: NetworkClient, cmd: string, data: any): void;
        public send(client: NetworkClient, cmd: string | HistoryItem, data?: any) {
            if (typeof cmd == "string")
                cmd = { command: cmd, data: data };
            client.send("worldedit.undoData", cmd);
        }

        public undo(): HistoryItem {
            return this.list[--this.index];
        }
        public redo(): HistoryItem {
            if (this.count == this.index) return null;
            return this.list[this.index++];
        }
        public clear() {
            this.index = 0;
        };
    }


    Network.addClientPacket<HistoryItem>("worldedit.undoData", function (data) {
        WorldEdit.History.push(data);
    });

    export const History = new HistoryStack();
    export enum HistoryAction { UNDO, REDO };
}

//For commands
namespace WorldEdit {
    export const addCommand = Commands.register;
    export const getCommand = Commands.get;
    export const invokeCommand = Commands.invoke;
}



WorldEdit.setPosition(0, { x: Infinity, y: Infinity, z: Infinity }, false);
WorldEdit.setPosition(1, { x: Infinity, y: Infinity, z: Infinity }, false);

ModAPI.registerAPI("WorldEdit", WorldEdit);
