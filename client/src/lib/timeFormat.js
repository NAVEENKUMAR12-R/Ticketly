const timeFormat = (minutes) => {
    const mins = Number(minutes) || 120;
    const hours = Math.floor(mins / 60);
    const minutesRemainder = mins % 60;
    return `${hours}h ${minutesRemainder}m`;
}

export default timeFormat;