import { Collapse, Button, Card } from "@blueprintjs/core";
import { useState } from "react";

function CollapsibleContainer() {
    const [isOpen, setOpen] = useState(false)
    return (<Card>
            <Button onClick={() => setOpen(!isOpen)} text={"Toggle"} />
            <Collapse isOpen={isOpen}>
                <h1>Test</h1>
            </Collapse>   
    </Card>)
}

export default CollapsibleContainer