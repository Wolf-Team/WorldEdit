type HistoryItem = { command: string, data: any };
enum HistoryAction { UNDO, REDO };
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

class WorldEdit {
    //Poistion
    private static _vectors: Vector[] = [];
    public static setPosition(pos: number, point: Vector): void;
    public static setPosition(pos: number, point: Vector, invokeCallback: false): void;
    public static setPosition(pos: number, point: Vector, invokeCallback: boolean = true) {
        this._vectors[pos] = copyObject({}, point);
        if (invokeCallback !== false)
            Callback.invokeCallback("worldedit.set_position", pos, this._vectors[pos]);
    }
    public static getPosition(pos: number): Vector {
        if (this._vectors[pos].x != Infinity)
            return copyObject({}, this._vectors[pos]);

        for (let i = 0, l = this._vectors.length; i < l; i++)
            if (this._vectors[i].x != Infinity)
                return copyObject({}, this._vectors[i]);

        return null;
    }

    public static getSizeArea(): number {
        const pos1 = this.getPosition(0);
        const pos2 = this.getPosition(1);
        return (Math.abs(pos1.x - pos2.x) + 1) * (Math.abs(pos1.y - pos2.y) + 1) * (Math.abs(pos1.z - pos2.z) + 1);
    }

    public static checkValidPosition(): boolean {
        return this.getPosition(0).x != Infinity
    }

    //limit
    private static _limit: number = -1;
    public static checkValidLimit(limit: number): boolean {
        return this._limit == -1 || limit < this._limit;
    }
    public static setLimit(limit: number): void {
        Network.sendToAllClients("worldedit.setlimit", { limit: limit });
    }
    public static getLimit(): number {
        return this._limit;
    }


    //enabled wand
    private static _enabledWand: boolean = true;
    private static _enabledWandForActors: Dict<boolean> = {};
    public static enabledWand(actor: number = null): boolean {
        return actor ? (this._enabledWandForActors[actor] || false) : this._enabledWand;
    }
    public static setEnableWand(enable: boolean) {
        this._enabledWand = enable;
        Network.sendToServer("worldedit.enablewand", { enable: enable });
    }
    public static enableWand(): void {
        this.setEnableWand(true);
    }
    public static disableWand(): void {
        this.setEnableWand(false);
    }
    public static toggleWand(): void {
        this.setEnableWand(!this._enabledWand);
    }

    //Enabled WE
    private static _enabled: boolean = false;
    private static _errorEnabled: string = null;
    public static enabled() {
        return this._enabled;
    }

    //History
    public static readonly History = new HistoryStack();

    //For Commands
    public static readonly addCommand = Commands.register;
    public static readonly getCommand = Commands.get;
    public static readonly invokeCommand = Commands.invoke;

    //Utils
    public static parseBlockInfo(info: string, defaultData: number = 0): [number, number] {
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
    public static clear(): void {
        const l = this._vectors.length;
        for (let i = 0; i < l; i++)
            this.setPosition(i, { x: Infinity, y: Infinity, z: Infinity });

        this.enableWand();
        this._enabled = false;
        this._errorEnabled = null;
        this._enabledWandForActors = {};
    }


    //init worldedit
    public static init() {
        const _this = this;
        //poistion additive callback
        Callback.addCallback("worldedit.set_position", function (pos: number) {
            Callback.invokeCallback("worldedit.set_position_" + pos, _this._vectors[pos]);
        });

        //enabled wand
        Network.addServerPacket<{ enable: boolean }>("worldedit.enablewand", function (client, data) {
            _this._enabledWandForActors[client.getPlayerUid()] = data.enable;
        });

        //enabled WE
        Callback.addCallback("LevelSelected", function () {
            _this._enabled = true;
        });
        Callback.addCallback("LevelPreLoaded", function () {
            if (Network.inRemoteWorld())
                Network.sendToServer("worldedit.connect", { version: new String(__mod__.getMultiplayerVersion()) });
        });
        Callback.addCallback("LevelDisplayed", function () {
            if (!_this._enabled)
                Game.message(_this._errorEnabled ? _this._errorEnabled : Translation.translate("WorldEdit was not found on the server."));
            else {
                Game.message(Translation.translate("WorldEdit %version% is enabled!").replace("%version%", __mod__.getMultiplayerVersion()));
                _this.enableWand();
            }
        });

        Network.addServerPacket<{ version: string }>("worldedit.connect", function (client, data) {
            const version = new String(__mod__.getMultiplayerVersion());

            if (data.version == version) {
                client.send("worldedit.connected", { success: 1 });
            } else
                client.send("worldedit.connected", { version: version });

        });
        Network.addClientPacket<{ success?: 1, version: string }>("worldedit.connected", function (data) {
            if (data.success == 1) {
                _this._enabled = true;
            } else {
                _this._errorEnabled = Translation.translate("Different versions of WorldEdit.\nWorldEdit features are disabled.\nYour version is %version%.\nServer version: %server%.")
                    .replace("%version%", __mod__.getMultiplayerVersion())
                    .replace("%server%", data.version);
            }
        });


        //History
        Network.addClientPacket<HistoryItem>("worldedit.undoData", function (data) {
            _this.History.push(data);
        });

        //limit
        Network.addClientPacket<{ limit: number }>("worldedit.setlimit", (data) => {
            _this._limit = data.limit;
        });

        //init

        this.setPosition(0, { x: Infinity, y: Infinity, z: Infinity }, false);
        this.setPosition(1, { x: Infinity, y: Infinity, z: Infinity }, false);
    }
}

WorldEdit.init();

ModAPI.registerAPI("WorldEdit", WorldEdit);

namespace ModAPI {
    export declare function addAPICallback(name: "WorldEdit", call: (ob: WorldEdit) => void): void;
}

namespace Callback {
    export declare function addCallback(name: "worldedit.desel", call: () => void): void;
    export declare function addCallback(name: "worldedit.set_position", call: (num_position: number, position: Vector) => void): void;
    export declare function addCallback(name: "worldedit.set_position_0", call: (position: Vector) => void): void;
    export declare function addCallback(name: "worldedit.set_position_1", call: (position: Vector) => void): void;
}
