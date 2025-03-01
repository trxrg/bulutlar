const Owner = (sequelize, DataTypes) => {
    return sequelize.define('owner', {
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: {
                args: true,
                msg: "This owner is already added."
            },
            validate: {
                len: {
                    args: [1, 255],
                    msg: "Owner name must be at least 1 character long.",
                },
                notEmpty: {
                    msg: "Owner name cannot be empty."
                },
                is: {
                    args: [/^(?=.*[a-zA-Z0-9]).+$/], // Requires at least one alphanumeric character
                    msg: "Owner name must contain at least one alphanumeric character."
                },
                // isValidContent(value) {
                //     // Check if the content consists only of whitespace or non-alphanumeric characters
                //     if (!/\S/.test(value)) { // Matches any non-whitespace character
                //         throw new Error("Content must contain at least one non-whitespace character.");
                //     }
                // }
            }
        },
        ordering: { type: DataTypes.INTEGER },
        field1: { type: DataTypes.STRING },
        field2: { type: DataTypes.STRING }
    });
};

export default Owner;