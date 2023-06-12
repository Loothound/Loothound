import {
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatArrow,
  StatHelpText,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';

export function SampleStats() {
  return (
    <SimpleGrid columns={3} spacing={10} px={5} my={4}>
      <Card flexGrow={1}>
        <CardBody>
          <Stat>
            <StatLabel>Net Worth</StatLabel>
            <StatNumber>69 div</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />2 div
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Income</StatLabel>
            <StatNumber>42 div / h</StatNumber>
            <StatHelpText>Based on last hour</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Snapshot Count</StatLabel>
            <StatNumber>1</StatNumber>
            <StatHelpText>12 seconds ago</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  );
}
