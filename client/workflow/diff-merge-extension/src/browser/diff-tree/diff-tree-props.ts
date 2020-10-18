import { MenuPath } from "@theia/core";
import { TreeProps } from "@theia/core/lib/browser";

export class DiffTreeProps implements TreeProps {
    contextMenuPath?: MenuPath | undefined;
    leftPadding: number;
    expansionTogglePadding: number;
    multiSelect?: boolean | undefined = false;
    search?: boolean | undefined;
    virtualized?: boolean | undefined;
    scrollIfActive?: boolean | undefined;
    globalSelection?: boolean | undefined;

}
