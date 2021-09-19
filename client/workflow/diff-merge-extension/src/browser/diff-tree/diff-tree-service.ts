import { DisposableCollection, Emitter, Event } from "@theia/core";
import { WidgetFactory } from "@theia/core/lib/browser";
import { inject, injectable } from "inversify";

import { DiffSymbolInformationNode, DiffTreeWidget, DiffViewWidgetFactory } from "./diff-tree-widget";

@injectable()
export class DiffTreeService implements WidgetFactory {

    id = 'diff-tree-service';

    protected widget?: DiffTreeWidget;
    protected readonly onDidChangeOutlineEmitter = new Emitter<DiffSymbolInformationNode[]>();
    protected readonly onDidChangeOpenStateEmitter = new Emitter<boolean>();
    protected readonly onDidSelectEmitter = new Emitter<DiffSymbolInformationNode>();
    protected readonly onDidOpenEmitter = new Emitter<DiffSymbolInformationNode>();

    constructor(@inject(DiffViewWidgetFactory) protected factory: DiffViewWidgetFactory) { }

    get onDidSelect(): Event<DiffSymbolInformationNode> {
        return this.onDidSelectEmitter.event;
    }

    get onDidOpen(): Event<DiffSymbolInformationNode> {
        return this.onDidOpenEmitter.event;
    }

    get onDidChangeOutline(): Event<DiffSymbolInformationNode[]> {
        return this.onDidChangeOutlineEmitter.event;
    }

    get onDidChangeOpenState(): Event<boolean> {
        return this.onDidChangeOpenStateEmitter.event;
    }

    get open(): boolean {
        return this.widget !== undefined && this.widget.isVisible;
    }

    /**
     * Publish the collection of outline view symbols.
     * - Publishing includes setting the `OutlineViewWidget` tree with symbol information.
     * @param roots the list of outline symbol information nodes.
     */
    publish(roots: DiffSymbolInformationNode[]): void {
        if (this.widget) {
            this.widget.setOutlineTree(roots);
            this.onDidChangeOutlineEmitter.fire(roots);
        }
    }

    createWidget(): Promise<DiffTreeWidget> {
        this.widget = this.factory();
        const disposables = new DisposableCollection();
        disposables.push(this.widget.onDidChangeOpenStateEmitter.event(open => this.onDidChangeOpenStateEmitter.fire(open)));
        disposables.push(this.widget.model.onOpenNode(node => this.onDidOpenEmitter.fire(node as DiffSymbolInformationNode)));
        disposables.push(this.widget.model.onSelectionChanged(selection => this.onDidSelectEmitter.fire(selection[0] as DiffSymbolInformationNode)));
        this.widget.disposed.connect(() => {
            this.widget = undefined;
            disposables.dispose();
        });
        return Promise.resolve(this.widget);
    }
}
