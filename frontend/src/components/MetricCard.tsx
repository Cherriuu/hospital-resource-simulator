type MetricCardProps = {
    title: string;
    value: number;
    unit: string;
};

function MetricCard({ title, value, unit }: MetricCardProps) {
    return (
        <div className="border rounded-lg p-4 bg-white">
            <p className="font-serif text-sm">{title}</p>
            <p className="font-serif text-2xl">
                {value} <span className="text-sm">{unit}</span>
            </p>
        </div>
    );
}

export default MetricCard;