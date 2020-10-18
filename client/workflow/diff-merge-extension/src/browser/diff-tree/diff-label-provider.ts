import { LabelProvider } from "@theia/core/lib/browser";

export class DiffLabelProvider extends LabelProvider {
    getIcon(element: object): string {

        console.log("providing");
        return "fa-chevron-down";
    }
}
