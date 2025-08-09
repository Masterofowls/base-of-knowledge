import {PanelAdmin} from "widgets/PanelAdmin";
import {classNames} from "shared/lib/classNames/classNames.ts";
import {QuickActionsAdmin} from "widgets/QuickActionsAdmin";
import {LatestPosts} from "widgets/LatestPosts";
import {Groups} from "widgets/Groups";

export default function  MainPage() {
    return (
        <div style={{maxWidth: '1230px', display: 'flex', flexDirection: 'column'}} className={classNames('container', {}, [])}>
            <PanelAdmin/>
            <QuickActionsAdmin/>
            <div style={{display: 'flex', flexDirection: 'row', margin: "45px 0px", gap: '45px'}}>
                <LatestPosts/>
                <Groups/>
            </div>
        </div>
    );
}