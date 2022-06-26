import react from 'react';
import { Form } from 'react-bootstrap';

interface IProps {
    count: number;
    setCounter: (count: number) => void;
}

const Counter = ({ count, setCounter }: IProps) => {
    return (
        <Form>
            <Form.Group>
                <Form.Label>View top N players per sample</Form.Label>
                <Form.Control type="number" defaultValue={(count).toString()} onChange={(event) => {
                    const value = parseInt(event.target.value);
                    if (value > 0) {
                        setCounter(value);
                    }
                }} />
            </Form.Group>
        </Form>
    );
}

export default Counter;