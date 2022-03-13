import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Stepper } from "@material-ui/core";
import { Step } from "@material-ui/core";
import { StepLabel } from "@material-ui/core";
import { StepContent } from "@material-ui/core";
import { Button } from "@material-ui/core";
import { Typography } from "@material-ui/core";
import { TextField } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
    },
    button: {
        marginTop: theme.spacing(1),
        marginRight: theme.spacing(1),
    },
    actionsContainer: {
        marginBottom: theme.spacing(2),
    },
    resetContainer: {
        padding: theme.spacing(3),
    },
}));

function getSteps() {
    return ['Provide your email', 'Receive your coupon!'];
}

function getStepContent(step) {
    switch (step) {
        case 0:
            return `Please enter your email address:`;
        case 1:
            return `We have sent a coupon code to your email address.`;
        default:
            return `Unknown step`;
    }
}

export default function VerticalLinearStepper() {
    const classes = useStyles();
    const [activeStep, setActiveStep] = React.useState(0);
    const steps = getSteps();

    const handleNext = () => {
        setActiveStep(prevActiveStep => prevActiveStep + 1);
    };

    return (
        <div className={classes.root}>
            <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((label, index) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                        <StepContent>
                            <Typography>{getStepContent(index)}</Typography>
                            {activeStep === 0 ? <TextField /> : null}
                            <div className={classes.actionsContainer}>
                                {activeStep === 0 && (
                                    <div>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onclick={handleNext}
                                            className={classes.button}
                                        >
                                            Submit
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
        </div>
    );
}