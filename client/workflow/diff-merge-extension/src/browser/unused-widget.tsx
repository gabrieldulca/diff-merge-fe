import * as React from 'react';
import { injectable, postConstruct, inject } from 'inversify';
import { AlertMessage } from '@theia/core/lib/browser/widgets/alert-message';

//import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import {EditorWidget } from "@theia/editor/lib/browser";
import { MessageService } from '@theia/core';
import { DiffService } from '@theia/workspace/lib/browser/diff-service';

@injectable()
export class UnusedWidget extends EditorWidget {

    static readonly ID = 'diff-merge-fe:widget';
    static readonly LABEL = 'DiffMergeFe Widget';

    @inject(MessageService)
    protected readonly messageService!: MessageService;
    @inject(DiffService)
    protected readonly diffService!: DiffService;

    @postConstruct()
    protected async init(): Promise < void> {
        this.id = UnusedWidget.ID;
        this.title.label = UnusedWidget.LABEL;
        this.title.caption = UnusedWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'fa fa-window-maximize'; // example widget icon.
        this.update();
    }

    protected render(): React.ReactNode {
        const header = `This is a sample widget which simply calls the messageService
        in order to display an info message to end users.`;
        return <div id='widget-container'>
        <AlertMessage type='INFO' header={header} />
        <button className='theia-button secondary' title='Display Message' onClick={_a => this.displayMessage()}>Display Message</button>
        </div>;
    }

    protected displayMessage(): void {
        this.messageService.info('Congratulations: DiffMergeFe Widget Successfully Created!');
    }

}
