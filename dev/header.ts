/*
 __        __          _     _ _____     _ _ _
 \ \      / /___  _ __| | __| | ____| __| (_) |_
  \ \ /\ / // _ \| '__| |/ _` |  _|  / _` | | __|
   \ V  V /| (_) | |  | | (_| | |___| (_| | | |_
    \_/\_/  \___/|_|  |_|\__,_|_____|\__,_|_|\__|

    WorldEdit v1.5 ©WolfTeam
    GitHub: https://github.com/Wolf-Team
            https://github.com/Wolf-Team/WorldEdit
    VK: https://vk.com/wolf___team
*/
type Dict<T = any> = { [key: string]: T };
function roundFloat(x: number, y: number = 10): number {
    return Math.round(x * y) / y;
}

function __n<T>(count: number, one: T, multi: T): T {
    return count == 1 ? one : multi;
}

function copyObject(target, ...sources) {
    for (let i in sources) {
        const source = sources[i];
        for (let key in source)
            target[key] = source[key];
    }
    return target;
}

function copyRecObject(target, ...sources) {
    for (let i in sources) {
        const source = sources[i];
        for (let key in source) {
            const field = source[key];

            target[key] = typeof field == "object" ? copyRecObject({}, field) : field;
        }
    }
    return target;
}

Object.values = function <T>(o: { [s: string]: T } | ArrayLike<T>): T[] {
    const arr: T[] = [];
    for (const s in o)
        arr.push(o[s]);
    return arr;
};
